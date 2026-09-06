import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { config } from './config.js';
import { findByEmail, create } from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

const MIN_PASSWORD_LENGTH = 8;

const cookieExtractor = (req) => req?.cookies?.currentUser || null;

const initializeRegisterStrategy = () => {
  passport.use(
    'register',
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const { first_name, last_name } = req.body;
          const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

          if (!first_name || !last_name || !normalizedEmail || !password) {
            return done(null, false, { message: 'Faltan campos obligatorios', statusCode: 400 });
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return done(null, false, { message: 'Formato de email inválido', statusCode: 400 });
          }

          if (password.length < MIN_PASSWORD_LENGTH) {
            return done(null, false, {
              message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
              statusCode: 400,
            });
          }

          const existingUser = await findByEmail(normalizedEmail);
          if (existingUser) {
            return done(null, false, { message: 'El email ya está registrado', statusCode: 409 });
          }

          const hashedPassword = await hashPassword(password);

          const newUser = await create({
            first_name,
            last_name,
            email: normalizedEmail,
            password: hashedPassword,
          });

          return done(null, newUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

const initializeLoginStrategy = () => {
  passport.use(
    'login',
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

          if (!normalizedEmail || !password) {
            return done(null, false, { message: 'Credenciales inválidas', statusCode: 401 });
          }

          const user = await findByEmail(normalizedEmail);

          if (!user || !(await comparePassword(password, user.password))) {
            return done(null, false, { message: 'Credenciales inválidas', statusCode: 401 });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

const initializeCurrentStrategy = () => {
  passport.use(
    'current',
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: config.jwtSecret,
      },
      async (jwtPayload, done) => {
        try {
          return done(null, jwtPayload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

export const initializePassport = () => {
  initializeRegisterStrategy();
  initializeLoginStrategy();
  initializeCurrentStrategy();
};

export default passport;
